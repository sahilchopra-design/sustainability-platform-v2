## 7 · Methodology Deep Dive

This module matches the guide's own framing closely — it is explicitly described as a **"Report
template engine"** that "auto-populates from assessment data," not a scoring engine in its own
right. No mismatch blockquote is triggered: the guide makes no specific formula claim beyond
aggregation and regulatory mapping, and the code delivers exactly that (mean-of-scores aggregation,
a real A–E rating band function, and a real reference `TAXONOMY_TREE`). The one caveat: the
underlying entity-level "assessment data" it reports on is `sr()`-seeded synthetic data, not a live
feed from an actual taxonomy-assessment engine.

### 7.1 What the module computes

10 real named entities (Shell, BP, TotalEnergies, Enel, NextEra Energy, Rio Tinto, ArcelorMittal,
HeidelbergCement, Maersk, Deutsche Bank), each scored against every L1 topic in the platform's shared
`TAXONOMY_TREE` reference structure (imported from `frontend/src/data/taxonomyTree.js`, which also
supplies `scoreToRating`, `REFERENCE_DATA_SOURCES`, `HIGH_IMPACT_SECTORS`, `GEOGRAPHIC_REGIONS`, and
`REGULATORY_REQUIREMENTS`). 6 tabs (Executive Summary, Entity Reports, Comparative Analysis,
Regulatory Mapping, Export Center, Scheduling) present the same underlying score matrix from
different angles.

### 7.2 Core formulas

```js
scores[entity][topic] = round(25 + sr(i×8+j×3) × 65)            // per-entity, per-L1-topic synthetic score, 25-90
overall(entity)        = round(Σ_topics scores[entity][topic] / TAXONOMY_TREE.length)   // unweighted mean
rating(entity)          = scoreToRating(overall(entity))          // A(≥80)/B(≥60)/C(≥40)/D(≥20)/E(<20)
portfolioAvg            = round(Σ_entities overall(entity) / entities.length)
l1PortfolioScores[topic] = round(mean(scores[*][topic]) across all 10 entities)          // per-topic portfolio mean
```

These are correct, guard-free (fixed non-empty constant lengths) unweighted aggregations at two
levels: within an entity (across L1 topics → `overall`) and across the portfolio (per topic and
overall → `portfolioAvg`). `scoreToRating`'s A–E band thresholds (80/60/40/20) are a standard
5-tier letter-grade convention, applied consistently to both individual entity scores and
portfolio-level topic averages.

### 7.3 Calculation walkthrough

1. **Executive Summary** — `portfolioAvg` and its rating badge, plus counts (entities assessed,
   L1 topics, jurisdictions).
2. **Entity Reports** — per-selected-entity drill-down showing all L1 topic scores and the entity's
   overall rating.
3. **Comparative Analysis** — `radarData` builds a multi-entity radar chart from up to N
   user-selected entities' per-topic scores (`compareEntities` index array) — a direct pass-through
   of the score matrix, no additional transformation.
4. **Regulatory Mapping** — `regData` maps each jurisdiction in `REGULATORY_REQUIREMENTS` to its
   real framework list and mandatory/partial/voluntary status, plus a `coverageScore` that is itself
   `sr()`-seeded (keyed on the jurisdiction name's first character code) — this one field is
   synthetic even though the framework/mandatory/effective-date fields it sits beside are real
   reference content.
5. **Export Center / Scheduling** — format selector (PDF/Excel/JSON/XBRL) and frequency selector
   (Quarterly etc.); UI state only, no export logic shown to be implemented in the excerpted
   portion of the file.

### 7.4 Worked example

Entity `i=3` ('Enel SpA'): for L1 topic index `j=0`, `score = round(25+sr(3×8+0×3)×65) =
round(25+sr(24)×65)`. `sr(24)=frac(sin(25)×10⁴)`; `sin(25 rad)≈-0.1324`, ×10⁴=-1324, frac (via
`x−floor(x)` on a negative) ≈ 0.676 → `score ≈ round(25+0.676×65) = round(68.9) = 69`. If Enel's
scores across all L1 topics average to, say, 71: `overall=71` → `scoreToRating(71)` → **B
(Good)**, since 71 falls in [60,80). Aggregating Enel alongside the other 9 entities into
`portfolioAvg`, and separately into `l1PortfolioScores` per topic, gives the portfolio-level view
shown in the Executive Summary — both are correct arithmetic over whatever the (synthetic)
underlying scores happen to be.

### 7.5 Data provenance & limitations

- **All entity×topic scores are `sr()`-seeded**, attached to 10 real company names — illustrative
  demo data, not actual EU Taxonomy assessment results for these companies.
- `regData.coverageScore` is a synthetic random field sitting alongside otherwise-accurate
  regulatory reference content (framework names, mandatory status, effective dates) — the one
  fabricated number in an otherwise real reference table.
- The module correctly does **not** claim to compute taxonomy alignment itself — it is a reporting/
  aggregation layer over whatever assessment data is fed to it, consistent with its "report template
  engine" self-description.

**Framework alignment:** TCFD, ISSB S2, and CSRD are named as the regulatory frameworks this report
maps assessment coverage against; `REGULATORY_REQUIREMENTS` (imported reference data) appears to hold
accurate per-jurisdiction framework/mandatory-status/effective-date information, giving the
Regulatory Mapping tab genuine reference value independent of the synthetic score layer above it.
