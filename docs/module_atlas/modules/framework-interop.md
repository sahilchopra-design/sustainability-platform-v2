# Framework Interoperability
**Module ID:** `framework-interop` · **Route:** `/framework-interop` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Maps disclosure requirements across TCFD, ISSB IFRS S1/S2, ESRS (CSRD), GRI Standards, and CDP frameworks to identify overlaps, gaps, and sequencing opportunities. Enables organisations to build a single disclosure architecture that satisfies multiple frameworks simultaneously, reducing duplication and compliance cost.

> **Business value:** Reduces disclosure duplication by identifying a minimum set of datapoints that simultaneously satisfies TCFD, ISSB, ESRS, GRI, and CDP. Enables sustainability teams to build a single data architecture serving all frameworks and provides a compliance roadmap aligned to regulatory deadlines across jurisdictions.

**How an analyst works this module:**
- Select the frameworks applicable to your organisation based on jurisdiction, listing venue, and stakeholder requirements.
- Run the coverage matrix to identify which requirements are satisfied by a single disclosure and which require framework-specific responses.
- Use the gap analysis tab to prioritise data collection for requirements unique to each framework.
- Export the unified disclosure calendar with framework-by-framework mapping for project planning.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BRSR_PRINCIPLES`, `Badge`, `Btn`, `Card`, `FRAMEWORKS`, `FW_IDS`, `INTEROP_MATRIX`, `KPI`, `LS_KEY`, `LS_PORTFOLIO`, `OVERLAP_PAIRS`, `SectionTitle`, `TIMELINE`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FRAMEWORKS` | 9 | `name`, `color`, `org`, `focus`, `mandatory_in`, `disclosures`, `materiality`, `year`, `type` |
| `INTEROP_MATRIX` | 25 | `cat`, `ISSB`, `CSRD`, `GRI`, `TCFD`, `SFDR`, `EU_TAX`, `TNFD`, `BRSR` |
| `BRSR_PRINCIPLES` | 10 | `name`, `global` |
| `TIMELINE` | 12 | `event`, `fw` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `FW_IDS` | `FRAMEWORKS.map(f => f.id);` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`.replace(/"/g, '""')).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `totalDisclosures` | `FRAMEWORKS.reduce((s, f) => s + f.disclosures, 0);` |
| `mostConnected` | `[...INTEROP_MATRIX].sort((a, b) => FW_IDS.filter(f => b[f]).length - FW_IDS.filter(f => a[f]).length)[0];` |
| `leastCovered` | `[...INTEROP_MATRIX].sort((a, b) => FW_IDS.filter(f => a[f]).length - FW_IDS.filter(f => b[f]).length)[0];` |
| `fwCoverage` | `useMemo(() => Math.round(68 + sRand(seed('fwCov')) * 22), []);` |
| `convergenceData` | `useMemo(() => { return [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map(yr => ({ year: yr, score: Math.min(100, Math.round(25 + (yr - 2018) * 8.2 + sRand(seed('conv' + yr)) * 5)), }));` |
| `optimizedDataPoints` | `useMemo(() => { return INTEROP_MATRIX.map(r => { const fwCount = FW_IDS.filter(f => r[f]).length;` |
| `radarData` | `useMemo(() => { return FRAMEWORKS.map(fw => ({ framework: fw.id, fullName: fw.name, topics: INTEROP_MATRIX.filter(r => r[fw.id]).length, max: INTEROP_MATRIX.length, }));` |
| `burdenData` | `useMemo(() => { return Object.entries(COUNTRY_FW_MAP).map(([cc, fws]) => ({ country: cc, frameworks: fws.length, disclosures: fws.reduce((s, fid) => s + (FRAMEWORKS.find(f => f.id === fid)?.disclosures \|\| 0), 0), fws: fws.join(', ') \|\| 'None mandatory', })).sort((a, b) => b.disclosures - a.disclosures);` |
| `avg` | `Math.round(dims.reduce((s, v) => s + v, 0) / dims.length);` |
| `topOverlaps` | `OVERLAP_PAIRS.filter(p => p.a === fw.id \|\| p.b === fw.id).sort((a, b) => b.shared - a.shared).slice(0, 5);` |
| `hours` | `Math.round(fw.disclosures * (2.5 + sRand(seed(fw.id + 'effort')) * 4));` |
| `weeks` | `(hours / 40).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BRSR_PRINCIPLES`, `FRAMEWORKS`, `INTEROP_MATRIX`, `TIMELINE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| TCFD-to-ISSB Alignment (%) | — | IFRS Foundation mapping table | ISSB IFRS S2 incorporates substantially all TCFD recommendations; residual 13% relates to industry-specific metrics not in TCFD. |
| ESRS-to-ISSB Overlap (%) | — | EFRAG-ISSB interoperability analysis 2023 | Two-thirds of ISSB S2 datapoints are satisfied by ESRS E1 compliance; the gap relates to transition plan granularity requirements. |
| Unique GRI Requirements | — | GRI Standards 2021 | GRI covers social and economic topics not addressed by TCFD/ISSB/ESRS, including tax, anti-corruption, and supply chain labour practices. |
| CDP-to-TCFD Alignment (%) | — | CDP Technical Note 2023 | CDP questionnaire questions map almost entirely to TCFD pillars; residual items relate to water and forests modules. |
- **Framework requirement databases (ISSB/ESRS/GRI/CDP)** → Tag requirements by topic and disclosure type, compute Jaccard matrix → **Interoperability coverage heatmap**
- **Organisation disclosure inventory** → Map existing disclosures to framework requirements → **Gap analysis by framework**
- **Regulatory deadline calendar** → Sequence requirements by jurisdiction and mandatory vs voluntary status → **Prioritised disclosure roadmap**

## 5 · Intermediate Transformation Logic
**Methodology:** Disclosure Coverage Matrix
**Headline formula:** `Coverage_ij = |Requirements_i ∩ Requirements_j| / |Requirements_i ∪ Requirements_j|`

Computes Jaccard similarity between framework requirement sets to quantify inter-framework alignment. Each requirement is tagged by topic (climate, water, biodiversity, governance, social) and disclosure type (governance, strategy, risk management, metrics/targets) enabling structured gap analysis.

**Standards:** ['IFRS S1/S2 (ISSB 2023)', 'ESRS 1/2 + E1-S4-G1 (EFRAG 2023)', 'TCFD Final Recommendations (2017)', 'GRI Universal Standards 2021']
**Reference documents:** IFRS Foundation â€” ISSB S1/S2 (June 2023); EFRAG â€” ESRS Set 1 Final Standards (July 2023); EFRAG-ISSB Interoperability Guidance (2023); GRI-ISSB Joint Statement on Collaboration (2022); CDP Technical Note: Reporting on Climate (2023)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The Framework Interoperability module (EP-Q5) is primarily a **factual disclosure-crosswalk**: a
24-topic × 8-framework interoperability matrix with real datapoint references, from which pairwise
framework overlaps and "minimum data-point set" coverage are *computed for real*. Only two decorative
headline figures (framework-coverage KPI, convergence-score trend) are `sRand()`-seeded. There is no
guide↔code mismatch on the substance — the matrix is accurate reference content, not a risk model.

### 7.1 What the module computes

**Pairwise framework overlap** (real, from the matrix):
```js
shared(a,b) = # topics where INTEROP_MATRIX[row][a] && INTEROP_MATRIX[row][b]
OVERLAP_PAIRS = all (a,b) pairs with shared > 0, sorted descending
```

**Topic coverage** (real): for each topic, `coverage = FW_IDS.filter(f => row[f]).length` — how many of
the 8 frameworks address that topic. **Optimised data-point set** (real): topics addressed by ≥5
frameworks; the footer computes `#(fwCount≥5) / 24 × 100` as the coverage you achieve by collecting
just those high-overlap data points.

**Seeded decoration** (the only non-factual numbers):
```js
fwCoverage      = round(68 + sRand(seed('fwCov'))·22)        // 68–90%, synthetic KPI
convergenceData = year → min(100, round(25 + (yr−2018)·8.2 + sRand(...)·5))   // trend + noise
```

### 7.2 Parameterisation / scoring rubric — the crosswalk

**8 frameworks** with real attributes (org, materiality lens, mandatory jurisdictions, datapoint count):

| Framework | Materiality | Disclosures | Mandatory in |
|---|---|---|---|
| ISSB (IFRS S1/S2) | Financial | 11 | UK, AU, JP, SG, HK, NG, KE |
| CSRD (ESRS) | Double | 82 | EU27 |
| GRI | Impact | 85 | EU (via CSRD reference) |
| TCFD / ISSB S2 | Financial | 11 | UK, JP, SG, NZ, HK |
| SFDR | Impact | 14 | EU27 |
| EU Taxonomy | Activity | 6 | EU27 |
| TNFD LEAP | Double | 14 | Voluntary (320+ adopters) |
| BRSR (India) | Impact | 180 | IN (top 1000) |

The **interoperability matrix** (24 topics) carries genuine datapoint anchors — e.g. GHG Scope 1+2 maps
to ISSB S2.29, CSRD ESRS E1-6, GRI 305-1/2, TCFD Metrics b), SFDR PAI 1-3, EU Taxonomy TSC threshold,
TNFD M-A, BRSR P6. These references are accurate to the actual standards. The **BRSR 9-principle
mapping** and the **framework timeline** (GRI 2000 → CSRD 2024/2026) are likewise factual.

### 7.3 Calculation walkthrough

1. `computeOverlaps()` scans the 24×8 matrix for every framework pair → shared-topic count, sorted.
2. Topic table: per-row coverage count across the 8 frameworks (sortable).
3. Optimised set: filter topics with fwCount ≥5; compute the coverage % achievable.
4. Radar: per-framework topic coverage; timeline: chronological framework releases.
5. `fwCoverage` KPI and `convergenceData` trend are seeded (decorative).

### 7.4 Worked example (overlap + optimised set)

For ISSB vs CSRD, the matrix rows where both are non-null include GHG Scope 1+2 (S2.29 / ESRS E1-6),
Scope 3, Climate Scenario Analysis, Transition Plan, Board Oversight, Energy, Climate Target Setting,
Stakeholder Engagement — the highest-overlap pair, reflecting the real ISSB↔ESRS interoperability that
the EFRAG-ISSB joint mapping documents. For the optimised set: if 9 of the 24 topics are addressed by
≥5 frameworks, the footer reports `9/24 = 38%` coverage from collecting just those data points — the
"collect once, report many" thesis.

### 7.5 Data provenance & limitations

- **The crosswalk matrix, framework attributes, BRSR mapping and timeline are factual reference data**
  (accurate to ISSB/CSRD/GRI/TCFD/SFDR/EU Taxonomy/TNFD/BRSR as published).
- Overlap counts and coverage percentages are **real computations** on that matrix.
- **Only `fwCoverage` (68–90%) and the convergence-score trend are `sRand()`-seeded** — decorative KPIs
  not grounded in any company data.
- A deterministic string-hash `seed()` + `sRand()` is used for those two figures.

**Framework alignment:** ISSB IFRS S1/S2 · CSRD/ESRS (double materiality) · GRI Standards · TCFD ·
SFDR PAI · EU Taxonomy (6 objectives + Minimum Safeguards) · TNFD LEAP · SEBI BRSR (9 principles). The
module encodes the actual EFRAG-ISSB interoperability guidance and the GRI-ESRS joint standard-setting
crosswalk — a genuinely useful reference layer.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The two seeded KPIs (framework coverage %,
convergence trend) have no company data behind them. Below is the production model for a company-level
disclosure-readiness/coverage score that would replace them.

### 8.1 Purpose & scope
Score a reporting entity's disclosure readiness across the 8 frameworks from its collected data points,
and identify the minimum incremental data set to reach a target coverage — for CSRD/ISSB reporting-
programme planning.

### 8.2 Conceptual approach
A **coverage-optimisation model** over the interoperability matrix, benchmarked against the
**EFRAG-ISSB Interoperability Guidance** and **GRI-ESRS joint mapping**: each collected data point
satisfies multiple framework requirements, so coverage is a set-cover problem, not a random percentage.

### 8.3 Mathematical specification
```
Coverage_f = |{ topics t : entity has data point for t AND matrix[t][f] ≠ null }|
           / |{ topics t : matrix[t][f] ≠ null }|                              per framework f
OverallReadiness = Σ_f w_f · Coverage_f            w_f = applicability weight (mandatory=1, voluntary<1)
MinDataSet = argmin |D|  s.t.  Coverage_f(D) ≥ target ∀ mandatory f            weighted set cover (greedy)
Convergence(t) = mean pairwise Jaccard( framework datapoint sets ) at time t   standards convergence
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| matrix[t][f] | topic→framework datapoint | EFRAG-ISSB / GRI-ESRS crosswalk (in module) |
| w_f | framework applicability | entity jurisdiction × mandatory status |
| target | required coverage | regulatory deadline (CSRD 100%) |

### 8.4 Data requirements
Per entity: which of the 24 topics it currently reports, applicable jurisdictions. Sources: the entity's
existing disclosures + the (already-present) interoperability matrix. No external vendor data needed.

### 8.5 Validation & benchmarking plan
Validate coverage against the entity's assured CSRD/ISSB report; check the greedy min-data-set against an
exact set-cover solution on the 24 topics; reconcile convergence trend against EFRAG-ISSB mapping
completeness over time.

### 8.6 Limitations & model risk
Matrix is topic-level, not full datapoint-level (ESRS has 1,000+ datapoints); framework requirements
evolve. Conservative fallback: treat topic coverage as necessary-not-sufficient and require datapoint-
level verification before claiming compliance.

## 9 · Future Evolution

### 9.1 Evolution A — Datapoint-level crosswalk with real Jaccard coverage (analytics ladder: rung 1 → 2)

**What.** §7 credits this as a genuine factual crosswalk: a 24-topic × 8-framework interoperability matrix (ISSB/CSRD/GRI/TCFD/SFDR/EU Taxonomy/TNFD/BRSR) with accurate datapoint references, from which pairwise overlaps and the "minimum data-point set" coverage are computed for real — only two decorative KPIs (`fwCoverage` 68–90%, the convergence-score trend) are `sRand()`-seeded. The §5 methodology names a Jaccard similarity (`|R_i ∩ R_j|/|R_i ∪ R_j|`) but the matrix operates at topic granularity. Evolution A deepens it from topic-level to datapoint-level: replace the 24 topic rows with the actual EFRAG-ISSB and GRI-ESRS datapoint crosswalks (published mappings), compute true Jaccard similarity per framework pair, and remove the two seeded decorative KPIs in favour of a computed coverage figure derived from a company's selected frameworks.

**How.** (1) Expand `INTEROP_MATRIX` into a datapoint table (ESRS datapoint ID ↔ ISSB paragraph ↔ GRI disclosure ↔ TCFD pillar), sourced from the EFRAG-ISSB interoperability guidance the module already cites. (2) Compute Jaccard per pair reproducing §5. (3) `fwCoverage` becomes `satisfied_datapoints/required_datapoints` for the user's framework selection — a real number, deleting the `sRand()` seed.

**Prerequisites.** The published datapoint crosswalk digitised into refdata (the ESRS/GRI catalogs are already in the DB per the roadmap); the two seeded KPIs removed. **Acceptance:** framework-pair Jaccard scores recompute from the datapoint sets; the coverage KPI responds to framework selection and carries no `sRand()`; overlap counts remain exact.

### 9.2 Evolution B — Disclosure-architecture copilot (LLM tier 1 → 2)

**What.** A copilot for sustainability teams: "we report under CSRD and ISSB and list in India — what's the minimum datapoint set, and where do BRSR requirements add unique work?" It narrates the real crosswalk (pairwise overlaps, least-covered topics, the optimised minimum set) and, tier-2, tool-calls the Evolution A coverage endpoint to compute the exact unified datapoint list and framework-specific gaps for the user's jurisdiction mix.

**How.** Tier 1 grounds on this atlas record and the module's factual matrix — a strong corpus because §7 confirms the crosswalk is accurate published reference content, not a model. The copilot's value is turning the matrix into a sequenced data-collection roadmap tied to the regulatory-deadline timeline the module carries. Tier 2 tool-calls the coverage/gap endpoint so "minimum datapoint set" is computed, not narrated. Since this is reference data rather than risk figures, the fabrication guard focuses on citing the specific matrix cell behind each mapping claim.

**Prerequisites.** Evolution A datapoint-level matrix for precise minimum-set computation (topic-level answers work today); corpus embedding. **Acceptance:** every framework-overlap or gap claim cites the matrix row/pair it derives from; the unified-datapoint answer post-Evolution-A matches the coverage endpoint output for the given framework selection.