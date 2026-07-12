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
