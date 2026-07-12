# DME Competitive Intelligence
**Module ID:** `dme-competitive` · **Route:** `/dme-competitive` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Peer materiality benchmarking powered by the Dynamic Materiality Engine, comparing an entity's topic-level materiality scores against sector peers and industry leaders. Identifies where competitors face higher or lower material risk, informing strategic positioning and disclosure strategy. Peer cohort is configurable by sector, geography, and market cap.

> **Business value:** Provides sustainability and strategy teams with a competitive lens on ESG material risk, identifying where the entity is relatively exposed or advantaged versus peers. Informs disclosure prioritisation and competitive positioning in investor ESG engagement.

**How an analyst works this module:**
- Configure the peer cohort using sector, geography, and market cap filters
- Review the RMI heat map to identify topics where the entity faces elevated relative exposure
- Drill into each topic to compare the entity's signal drivers against the peer distribution
- Export the competitive materiality report for use in strategy and investor engagement presentations

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COLORS`, `KpiCard`, `Section`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sorted` | `[...values].sort((a, b) => a - b);` |
| `esgPercentile` | `percentileRank(sectorPeers.map(p => p.esg_score \|\| 0), company.esg_score \|\| 0);` |
| `carbonPercentile` | `percentileRank(sectorPeers.map(p => 1 / (p.ghg_intensity_tco2e_per_mn \|\| 1)), 1 / (company.ghg_intensity_tco2e_per_mn \|\| 1));` |
| `transitionPercentile` | `percentileRank(sectorPeers.map(p => 100 - (p.transition_risk_score \|\| 0)), 100 - (company.transition_risk_score \|\| 0));` |
| `govPercentile` | `(company.esg_score \|\| 50) / 100 * 100;` |
| `selected` | `useMemo(() => filtered[selectedIdx] \|\| getEnrichedMaster()[0], [filtered, selectedIdx]);  /* ── Sector peers ──────────────────────────────────────────────────────── */ const sectorPeers = useMemo(() => { return getEnrichedMaster().filter(c => c.sector === selected.sector);` |
| `compScore` | `useMemo(() => computeCompetitiveScore(selected, sectorPeers), [selected, sectorPeers]);  /* ── All peer scores ───────────────────────────────────────────────────── */ const allPeerScores = useMemo(() => { return sectorPeers.map(p => { const sc = computeCompetitiveScore(p, sectorPeers);` |
| `sectorLeader` | `useMemo(() => sortedPeers[0] \|\| selected, [sortedPeers, selected]);  /* ── Radar data ────────────────────────────────────────────────────────── */ const radarData = useMemo(() => { const median = { esg: Math.round(sectorPeers.reduce((s, p) => s + (p.esg_score \|\| 0), 0) / sectorPeers.length), carbon: percentileRank(sectorPeers.map(p => 1 ` |
| `ratings` | `useMemo(() => estimateRatings(compScore.composite), [compScore]);  /* ── Sector statistics ─────────────────────────────────────────────────── */ const sectorStats = useMemo(() => { const scores = allPeerScores.map(p => p.composite);` |
| `esgScores` | `sectorPeers.map(p => p.esg_score \|\| 0);` |
| `carbonScores` | `sectorPeers.map(p => p.ghg_intensity_tco2e_per_mn \|\| 0);` |
| `avg` | `(arr) => arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length * 10) / 10 : 0;` |
| `median` | `(arr) => { const sorted = [...arr].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2 * 10) / 10; };` |
| `std` | `(arr) => { const m = avg(arr); return Math.round(Math.sqrt(arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / arr.length) * 10) / 10; };` |
| `peerDistribution` | `useMemo(() => { const buckets = [ { label: '0-20', min: 0, max: 20, count: 0, isSelected: false }, { label: '21-40', min: 21, max: 40, count: 0, isSelected: false }, { label: '41-60', min: 41, max: 60, count: 0, isSelected: false }, { label: '61-80', min: 61, max: 80, count: 0, isSelected: false }, { label: '81-100', min: 81, max: 100, co` |
| `quartileAnalysis` | `useMemo(() => { const sorted = [...allPeerScores].sort((a, b) => b.composite - a.composite);` |
| `selectedRank` | `sorted.findIndex(p => p.company_name === selected.company_name) + 1;` |
| `carbonEsgScatter` | `useMemo(() => { return sectorPeers.slice(0, 40).map(p => ({ name: p.company_name, esg: p.esg_score \|\| 0, carbon: p.ghg_intensity_tco2e_per_mn \|\| 0, isSelected: p.company_name === selected.company_name, composite: computeCompetitiveScore(p, sectorPeers).composite, }));` |
| `avgA` | `allPeerScores.reduce((s, p) => s + (p[a] \|\| 0), 0) / n;` |
| `avgB` | `allPeerScores.reduce((s, p) => s + (p[b] \|\| 0), 0) / n;` |
| `num` | `allPeerScores.reduce((s, p) => s + ((p[a] \|\| 0) - avgA) * ((p[b] \|\| 0) - avgB), 0);` |
| `denA` | `Math.sqrt(allPeerScores.reduce((s, p) => s + Math.pow((p[a] \|\| 0) - avgA, 2), 0));` |
| `denB` | `Math.sqrt(allPeerScores.reduce((s, p) => s + Math.pow((p[b] \|\| 0) - avgB, 2), 0));` |
| `rows` | `sortedPeers.map(p => [p.company_name, p.sector, p.composite, p.esg_rank, p.carbon_rank, p.transition_rank, p.governance_rank, p.data_quality_rank, p.esg_score, p.ghg_intensity_tco2e_per_mn, p.transition_risk_score].join(` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `prev` | `clamp(compScore.composite - 5 + Math.round(sRand(s) * 10), 5, 95);` |
| `prevPrev` | `clamp(prev - 3 + Math.round(sRand(s + 1) * 8), 5, 95);` |
| `change1` | `compScore.composite - prev;` |
| `change2` | `prev - prevPrev;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Peer Cohort Size | — | Peer selection engine | Count of companies in the configured peer comparison cohort |
| Topics Above Peer Median | — | RMI calculation | Count of material topics where the entity scores above the sector median RMI |
| Highest RMI Topic | — | DME benchmarking engine | Topic with the greatest relative materiality exposure versus the peer cohort |
| Lowest RMI Topic | — | DME benchmarking engine | Topic with the greatest relative resilience versus the peer cohort |
- **DME materiality scores (entity-level, all topics)** → Aggregation of peer scores by sector cohort and calculation of median distribution → **Peer distribution statistics per topic (median, P25, P75, min, max)**
- **Peer company registry with sector and geography metadata** → Cohort selection and filtering by user-defined parameters → **Peer cohort composition with company-level score table**
- **RMI calculation engine** → Entity score / cohort median normalisation per topic → **RMI heat map and ranked topic list with competitive gap analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** Relative Materiality Index
**Headline formula:** `RMI = Entity Scoreᵢ / Sector Median Scoreᵢ × 100`

The RMI compares each entity's topic materiality score against the sector median, producing a relative index where 100 equals median. Topics with RMI above 130 flag as areas of elevated relative exposure; those below 70 indicate relative resilience versus peers.

**Standards:** ['GRI Sector Standards Materiality', 'SASB Industry-Specific Materiality Map', 'EFRAG Sector-Specific ESRS']
**Reference documents:** SASB (2023) Materiality Map â€” Industry-Specific Material Topics; EFRAG (2023) Sector-Specific ESRS Development Roadmap; GRI (2022) Sector Standards â€” Material Topic Benchmarks; MSCI (2023) ESG Peer Comparison Methodology

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **Relative Materiality Index**
> (`RMI = Entity Scoreᵢ / Sector Median Scoreᵢ × 100`) benchmarking *topic-level materiality* against a
> peer cohort of 47 companies, with a topic heat-map (highest RMI "Water Stress 162", lowest "Digital
> Rights 54"). **No RMI, no topic-level materiality, and no water/digital-rights topics exist in the
> code.** What the page actually computes is a **five-dimension ESG competitive percentile score** over
> the `GLOBAL_COMPANY_MASTER` universe: percentile ranks for ESG, carbon efficiency, transition
> readiness, governance and data quality, blended into one composite and mapped to synthetic MSCI /
> Sustainalytics / S&P ratings. The sections below document the code as it actually behaves.

### 7.1 What the module computes

For every company in `GLOBAL_COMPANY_MASTER`, the page derives a **composite competitive score** from
percentile ranks *within the company's own sector cohort* (`sectorPeers = master.filter(sector === selected.sector)`):

```js
composite = round(
    esgPercentile        × 0.30
  + carbonPercentile     × 0.25
  + transitionPercentile × 0.20
  + govPercentile        × 0.15
  + dqPercentile         × 0.10 )
```

Each percentile uses a mid-rank empirical CDF:

```js
percentileRank(values, target):
   below = count(v < target); equal = count(v === target)
   return round( ((below + 0.5·equal) / n) × 100 )      // 50 if n = 0
```

The five inputs are:

| Dimension | Rank basis | Note |
|---|---|---|
| ESG | `percentileRank(peers.esg_score, esg_score)` | higher raw score → higher rank |
| Carbon efficiency | `percentileRank(1/ghg_intensity, 1/own_ghg)` | **inverts** intensity so low emitters rank high |
| Transition readiness | `percentileRank(100 − transition_risk, …)` | inverts risk so low-risk ranks high |
| Governance | `(esg_score/100)×100` | **not a percentile** — raw ESG rescaled to 0–100 (proxy) |
| Data quality | `data_quality_score` | raw 0–100 field passed straight through |

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| Composite weights | 0.30 / 0.25 / 0.20 / 0.15 / 0.10 | Hard-coded heuristic ("ported from dme-platform"); not a named standard |
| ESG rating cutoffs | AAA ≥80, AA ≥65, A ≥50, BBB ≥35, BB ≥25, B ≥15, else CCC | `estimateRatings()`; mirrors MSCI 7-notch letter scale but thresholds are invented |
| Sustainalytics band | Negligible ≥80, Low ≥60, Medium ≥40, High ≥20, else Severe | mirrors Sustainalytics 5-band risk categories (inverted sense) |
| S&P Global band | Strong ≥70, Average ≥45, else Laggard | heuristic |

**Synthetic enrichment** — where a company lacks a field, `enrichCompany()` fabricates it with the
string-hash PRNG `sRand(n)=frac(sin(n+1)×10⁴)` seeded by `seed(name)` (djb2/xor hash):

| Field | Fallback range |
|---|---|
| `esg_score` | 25 + rand·65 → 25–90 |
| `ghg_intensity_tco2e_per_mn` | 10 + rand·800 |
| `transition_risk_score` | 10 + rand·70 |
| `data_quality_score` | 20 + rand·70 |
| `implied_temp_rise` | clamp(1.2 + rand·2.8, 1.2, 4.5) °C |
| `market_cap_usd_mn` | 100 + rand·50 000 |

### 7.3 Calculation walkthrough

1. User selects a company (default index 0) from the search-filtered list.
2. `sectorPeers` = all master rows sharing the selected sector.
3. `computeCompetitiveScore(selected, sectorPeers)` → five ranks + composite.
4. `allPeerScores` scores every peer the same way → drives the ranked table, quartile analysis,
   peer distribution histogram (5 buckets 0–20…81–100), and carbon-vs-ESG scatter.
5. `estimateRatings(composite)` → letter/band ratings.
6. `sectorStats` (avg/median/std of composite across peers) and a Pearson correlation between any two
   selectable dimensions (`num/√(denA·denB)`) provide companion analytics.
7. A 3-point "trend" history is faked: `prev = clamp(composite − 5 + round(sRand(s)·10), 5, 95)`.

### 7.4 Worked example

Company with `esg_score = 72`, in a 6-firm sector cohort whose ESG scores are {40, 55, 60, 72, 80, 85};
`ghg_intensity = 120`; `transition_risk = 30`; `data_quality_score = 65`.

| Step | Computation | Result |
|---|---|---|
| ESG percentile | below=3, equal=1 → (3+0.5)/6×100 | **58** |
| Carbon percentile (assume 4 peers dirtier) | e.g. below 4 of 6 on 1/intensity | **75** |
| Transition percentile (assume mid) | (100−30) ranks 4/6 below | **67** |
| Governance proxy | 72/100×100 | **72** |
| Data quality | raw | **65** |
| Composite | 58·.30+75·.25+67·.20+72·.15+65·.10 | 17.4+18.75+13.4+10.8+6.5 = **66.85 → 67** |
| Rating | 67 ≥ 65 → AA; Low; Average | **AA / Low / Average** |

### 7.5 Companion analytics on the page

- **Radar** — company vs sector-median across the five dimensions (median carbon rank derived from the
  mean-intensity percentile; transition/governance/dataQuality medians hard-set to 50).
- **Gap analysis** — company rank vs sector-leader rank per dimension.
- **Quartile analysis / peer distribution** — composite sorted desc, `selectedRank` = 1-based position.
- **Cross-sector comparison** — re-scores the selected company against a *different* sector's cohort.
- **CSV export** of the full ranked peer table.

### 7.6 Data provenance & limitations

- The universe is `GLOBAL_COMPANY_MASTER`; any missing ESG/carbon/governance field is **synthetic**,
  produced by the seeded PRNG `sRand`. Ratings are heuristic mappings, **not** licensed MSCI /
  Sustainalytics / S&P outputs.
- "Governance" is not an independent signal — it is `esg_score` rescaled, so it is collinear with the
  ESG dimension (double-counts 30%+15% of the same field).
- No topic-level materiality, no RMI, no double-materiality — the guide's methodology is unimplemented.
- Percentiles are computed *within sector*, so a small cohort (n<5) yields coarse, unstable ranks.

**Framework alignment:** loosely mirrors **MSCI ESG Ratings** (industry-relative, best-in-class
percentile logic → 7-notch AAA–CCC letters, where MSCI actually weights key-issue scores by exposure and
management), **Sustainalytics ESG Risk Ratings** (5-band Negligible→Severe unmanaged-risk scale), and
**S&P Global CSA** percentile positioning. The code approximates the *shape* (industry-relative
percentile → letter) but not the underlying key-issue scoring any of those vendors run.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a defensible, industry-relative ESG competitiveness score for each issuer in the coverage
universe, supporting portfolio tilt decisions and issuer engagement. Coverage: all listed equities in
`GLOBAL_COMPANY_MASTER`, grouped by GICS sub-industry.

### 8.2 Conceptual approach
A **key-issue exposure-and-management model** in the style of **MSCI ESG Ratings** and **S&P Global
CSA**, replacing the flat 5-weight heuristic. Each issuer's score is a sector-calibrated,
exposure-weighted roll-up of underlying key-issue scores, then converted to an industry percentile and
letter. Benchmarks: MSCI ESG (exposure × management, industry-adjusted) and Sustainalytics (unmanaged
risk = exposure − management).

### 8.3 Mathematical specification
For issuer *i* in sector *s* with key issues *k* ∈ K(s):

```
KeyIssueScoreᵢₖ = Expₖ · (Mgmtᵢₖ − Riskₖ_baseline) ,  Expₖ ∈ [0,1] sector exposure weight
RawᵢS           = Σₖ wₖ(s) · KeyIssueScoreᵢₖ ,          Σₖ wₖ(s) = 1
Percentileᵢ     = empiricalCDF_s(RawᵢS)               (within-sector, mid-rank)
Letterᵢ         = notch(Percentileᵢ)  (AAA…CCC on fixed cutoffs)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Sector key-issue weights | `wₖ(s)` | SASB materiality map (industry-specific) |
| Exposure weights | `Expₖ` | Revenue-segment / asset-location data (Trucost, FactSet RBICS) |
| Management scores | `Mgmtᵢₖ` | CDP responses, policy disclosure, controversy feeds |
| Baseline risk | `Riskₖ_baseline` | Sector mean from prior-year universe |
| Letter cutoffs | — | MSCI-published AAA–CCC percentile bands |

### 8.4 Data requirements
Per-issuer key-issue exposures (revenue segmentation), management indicators (CDP, policies,
controversies), GHG intensity (Scope 1–3), governance metrics (board independence, pay). Free sources:
CDP public scores, company filings, EU Taxonomy alignment. Vendor: MSCI, Sustainalytics, Trucost. The
platform already holds `esg_score`, `ghg_intensity`, `transition_risk_score`, `data_quality_score` and
`reference_data` (SBTi, CDP) that can seed exposure and management proxies.

### 8.5 Validation & benchmarking plan
Rank-correlation (Spearman ρ) of composite vs licensed MSCI/Sustainalytics letters on the overlap
universe; target ρ ≥ 0.6. Stability test: quarter-on-quarter notch migration should be <10% absent real
events. Sensitivity: perturb each `wₖ` ±20% and confirm rank order is robust.

### 8.6 Limitations & model risk
Percentile scores are only as good as sector definition and cohort size; thin cohorts (n<10) need a
sector-group fallback. Management-minus-exposure logic is vulnerable to disclosure bias (well-disclosed
firms score higher regardless of performance). Conservative fallback: where key-issue data is missing,
default to sector median (percentile 50), never to a favourable value.

## 9 · Future Evolution

### 9.1 Evolution A — Build the promised topic-level RMI on real DME scores (analytics ladder: rung 1 → 2)

**What.** The §7 flag is specific: the guide promises a Relative Materiality Index (`RMI = entity score / sector median × 100`) over topic-level materiality, but "no RMI, no topic-level materiality, and no water/digital-rights topics exist in the code." What actually runs is a legitimate five-dimension percentile composite (mid-rank empirical CDF over `GLOBAL_COMPANY_MASTER` sector cohorts) — real math, wrong model, with three honest defects: the governance dimension is a rescaled ESG score rather than a percentile, the MSCI/Sustainalytics/S&P ratings are synthetic mappings from the composite, and the trend line is `sRand()`-seeded. Evolution A implements the actual RMI server-side.

**How.** (1) New endpoint in the DME route family computing per-topic RMI from `dme-entity`/`dme-index` topic materiality scores, with cohort medians, P25/P75 bands, and the guide's 130/70 exposure/resilience flags. (2) Fix the composite's governance proxy by ranking a real governance input (board metrics exist in `esg-governance-scorer`). (3) Delete the synthetic third-party rating mappings — displaying fabricated "MSCI ratings" for named companies is a liability, not a feature; `esg-ratings-comparator` is the honest home for real ratings. (4) Persist score snapshots so the trend chart reads history instead of seeded deltas.

**Prerequisites.** DME topic-score persistence (shared with dme-alerts Evolution A); a documented sector-topic mapping (SASB Materiality Map is already the cited standard). **Acceptance:** RMI for a fixture entity reproduces the formula by hand against cohort medians; no `sRand()` in the rendered path; synthetic rating badges removed.

### 9.2 Evolution B — Competitive-positioning copilot for investor engagement prep (LLM tier 2)

**What.** The module's stated workflow ends with "export the competitive materiality report for strategy and investor engagement" — an LLM-native deliverable. A tool-calling analyst answers "where are we most exposed vs. peers and what should we pre-empt in the next investor ESG call?" by pulling the entity's RMI heat map, quartile position, and peer-distribution stats from Evolution A's endpoints, then drafting the positioning narrative with each claim pinned to a computed figure.

**How.** Tool surface = the new RMI endpoint plus the existing cohort/percentile computations promoted server-side; grounding corpus = this Atlas record's §5/§7 (the empirical-CDF percentile definition prevents the model mis-explaining ranks). Draft renders through the report-studio layer per the tier-3 output pattern. The validator enforces that every percentile, RMI value, and rank quoted matches a tool response; peer names come only from the cohort query, never from model memory (stale universes are a real hazard with a company master).

**Prerequisites (hard).** Evolution A — today the trend is seeded and the rating labels are synthetic, so a generated report would attribute invented ratings to real companies in an investor-facing document. **Acceptance:** a golden-fixture report contains zero numerics unmatched to tool outputs, and asking "what does MSCI rate us?" refuses with a pointer to the ratings-comparator module rather than echoing the removed synthetic mapping.