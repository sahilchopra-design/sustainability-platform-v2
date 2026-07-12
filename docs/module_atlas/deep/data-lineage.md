## 7 · Methodology Deep Dive

The guide matches the code: a **lineage-coverage tracker** (`Lineage_coverage =
Metrics_with_full_lineage / Total_disclosed_metrics × 100%`). The module is a genuine, richly-specified
data-lineage documentation artefact — 19 tracked fields each with real source priority, transformation
logic, downstream-consumer lists, quality scores and freshness — plus an impact-analysis map and a
persisted audit trail. The lineage *content* is real and hand-authored (not seeded); only the generated
audit-trail entries and their before/after values use the PRNG.

### 7.1 What the module computes

```js
avgQuality      = round(Σ fields.quality / n)                        // real field quality scores
avgAge          = round(Σ fields.age_hours / n)                      // real freshness
lineageCoverage = round(#{fields with sources>0 AND downstream>0} / n · 100)
// audit-trail generation (seeded)
prevVal = (sr()·80 + 10).toFixed(1) ; newVal = (prevVal + (sr()−0.5)·20).toFixed(1)
```
Coverage is a real completeness ratio over the lineage register; per-category quality/age are real
averages of authored values.

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| Lineage fields | 19 (esg_score, scope1/2/3_mt, revenue, market_cap, evic, …) | **real** hand-authored register |
| Source priority | e.g. scope1 "Reported > BRSR > Estimate" | **real** substitution logic |
| Transformation | e.g. revenue "FX conversion to USD Mn (13 currencies)" | **real** documented logic |
| Downstream consumers | e.g. scope1 → GHG Tracker, WACI, PCAF, Carbon Budget, ITR | **real** dependency map |
| Field quality | esg 82, scope1 75, scope3 48, revenue 94, market_cap 96 | authored (plausible, PCAF-aligned) |
| Age (hours) | esg 12, scope3 72, market_cap 6 | authored freshness |
| Transformations catalogue | 13 named transforms with formulas | **real** |
| FX rates | 14 currencies with rate/multiplier/source | curated reference |
| Manual overrides | 7 (field, original, override, reason, user, date) | curated audit examples |
| Audit-trail values | `sr()`-generated prev/new | synthetic seeded |

### 7.3 Calculation walkthrough

`DATA_LINEAGE_FIELDS` register → `avgQuality`, `avgAge`, `lineageCoverage` computed → per-category
averages (`catAvgQuality`, `catAvgAge`) → freshness bar chart. Field selector shows the chosen field's
full lineage (sources → transformation → downstream). Impact-analysis picks a field and lists its
`IMPACT_MAP` downstream targets. Audit trail (persisted to `localStorage`) is generated with seeded
before/after values. CSV export flattens the register.

### 7.4 Worked example (lineage coverage)

Of 19 fields, suppose 17 have both a non-empty `sources` list and a non-empty `downstream` list (two
newly-added fields lack documented downstream):
```
lineageCoverage = round(17/19 · 100) = round(89.5) = 89%
avgQuality      = round((82+75+72+48+94+96+88+…)/19)   # mean of authored quality scores
```
Coverage is a genuine completeness metric — it drops precisely when a field's lineage documentation is
incomplete, which is exactly the CSRD assurance-readiness signal the guide describes.

### 7.5 Data provenance & limitations

- **The lineage register is real and hand-authored** — source priorities, transformation formulas and
  downstream-consumer maps are genuine platform documentation, one of the atlas's most authentic
  artefacts.
- Field quality/age values are authored (plausible) rather than sensed from live pipelines.
- **Audit-trail before/after values are `sr()`-seeded**; the trail is illustrative, not a real change log.

**Framework alignment:** CSRD assurance requirements (Art 34 — lineage underpins limited assurance) ·
DAMA DMBOK2 Ch 7 data lineage & impact analysis · ISO 19650 information management. Full lineage per the
guide requires source ID + transformation steps + quality checks + aggregation + disclosure mapping —
the register captures the first four for each field; coverage measures how many fields are fully
documented. This is a faithful lineage-documentation module.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Lineage is hand-authored (not auto-harvested
from pipelines) and the audit trail is seeded.

**8.1 Purpose & scope.** Auto-generate and maintain an end-to-end lineage DAG from source systems through
transformations to disclosed metrics, with impact analysis and assurance-readiness scoring.

**8.2 Conceptual approach.** **Automated lineage harvesting** from pipeline metadata (OpenLineage /
column-level lineage) rather than manual authoring — the pattern used by DataHub, Collibra and Alation;
coverage/assurance follows CSRD Art 34 evidence sufficiency.

**8.3 Mathematical specification.**
```
FullLineage(metric) = has(source_id) ∧ has(transform_log) ∧ has(quality_check)
                       ∧ has(aggregation) ∧ has(disclosure_map)
Coverage = |{m : FullLineage(m)}| / |disclosed metrics|
ImpactSet(field) = transitive closure of downstream edges in DAG
Hops(metric) = shortest path length source → disclosed metric
AssuranceReady = |{full-lineage key metrics}| / |key metrics|
```

| Parameter | Source |
|---|---|
| Pipeline lineage | OpenLineage / dbt / Airflow metadata |
| Transformation logs | ETL job metadata |
| Quality checks | data-quality-monitor |
| Disclosure map | csrd/tcfd reporting modules |

**8.4 Data requirements.** Column-level lineage events, transformation metadata, quality-check
associations, disclosure-metric registry. Sources: pipeline orchestrator, DQ monitor. The manual
register is the seed; auto-harvest replaces authoring.

**8.5 Validation & benchmarking.** Reconcile harvested lineage to the manual register; verify impact
sets against known dependencies; benchmark coverage against auditor lineage requirements.

**8.6 Limitations & model risk.** Auto-harvest misses non-instrumented transforms (manual Excel steps);
column-level lineage is heavy to maintain. Fallback: hybrid — auto-harvest plus manual annotation for
the gaps the register already documents.
