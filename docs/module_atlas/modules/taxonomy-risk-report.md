# Taxonomy Risk Report
**Module ID:** `taxonomy-risk-report` · **Route:** `/taxonomy-risk-report` · **Tier:** B (frontend-computed) · **EP code:** EP-CS5 · **Sprint:** CS

## 1 · Overview
Report generator with executive summary, entity-level reports, comparative analysis, regulatory mapping, and multi-format export.

**How an analyst works this module:**
- Executive Summary shows portfolio-level overview
- Entity Reports provides per-entity detail
- Regulatory Mapping shows framework coverage
- Export Centre generates PDF/Excel/JSON/XBRL

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Card`, `ENTITIES`, `RATING_COLORS`, `RatingBadge`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ENTITIES` | `['Shell plc', 'BP plc', 'TotalEnergies', 'Enel SpA', 'NextEra Energy', 'Rio Tinto', 'ArcelorMittal', 'HeidelbergCement', 'Maersk', 'Deutsche Bank'].map((name, i) => {` |
| `overall` | `Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Math.max(1, TAXONOMY_TREE.length));` |
| `portfolioAvg` | `useMemo(() => Math.round(ENTITIES.reduce((s, e) => s + e.overall, 0) / Math.max(1, ENTITIES.length)), []);` |
| `l1PortfolioScores` | `useMemo(() => TAXONOMY_TREE.map(t => ({` |
| `radarData` | `useMemo(() => TAXONOMY_TREE.map(t => {` |
| `regData` | `useMemo(() => Object.entries(REGULATORY_REQUIREMENTS).map(([geo, req]) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Export Formats | — | Engine | PDF, Excel, JSON, XBRL |

## 5 · Intermediate Transformation Logic
**Methodology:** Report template engine
**Headline formula:** `Auto-populates from assessment data with regulatory framework mapping`

Executive summary: portfolio-level L1 scores with A-E ratings. Entity reports: per-entity drill-down. Regulatory mapping: which assessment data covers TCFD/ISSB/CSRD requirements.

**Standards:** ['TCFD', 'ISSB S2', 'CSRD']
**Reference documents:** TCFD Recommendations; ISSB IFRS S2; CSRD ESRS

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Report on real assessment data instead of seeded scores (analytics ladder: rung 1 → 2)

**What.** The module is honest about being a "report template engine" (§7 finds no guide↔code mismatch) — the aggregation arithmetic is correct, `scoreToRating`'s A–E bands are consistently applied, and the imported `TAXONOMY_TREE`/`REGULATORY_REQUIREMENTS` reference layer is real. Its gap is the input side: every entity×topic score is `sr()`-seeded (§7.2), attached to 10 real names (Shell, Enel, Deutsche Bank...), and the Regulatory Mapping tab's `coverageScore` is the one fabricated number in an otherwise-real reference table (§7.5). Evolution A wires the report engine to actual assessment sources and implements the exports the UI already promises.

**How.** (1) Replace the score matrix with a pluggable assessment feed: sibling modules that compute real per-entity scores (the EU Taxonomy sub-module's alignment output, `taxonomy-hub`'s per-holding roll-up once its Evolution A lands) publish into a shared assessment store the report reads, preserving this module's role as pure aggregation layer. (2) Derive `coverageScore` from an actual count of populated assessment fields per jurisdiction's framework requirements — the mapping table already lists the requirements. (3) Implement the Export Center: PDF/Excel/JSON generation exists nowhere in the file today (§7.3 point 5 — "UI state only"); XBRL deferred until a tagging schema is chosen. (4) Keep the unweighted topic mean but add an optional materiality weighting, disclosed in the report footer.

**Prerequisites.** At least one upstream module producing persisted real scores — this module should not synthesize its own inputs. **Acceptance:** the same entity shows identical scores here and in the source module; `coverageScore` reproduces from requirement counts; an export button yields an actual file whose numbers match the on-screen matrix.

### 9.2 Evolution B — Disclosure-narrative drafter over the score matrix (LLM tier 1)

**What.** Report generation is the platform's most natural LLM surface: given the entity×topic matrix, ratings, and the Regulatory Mapping table, a copilot drafts the Executive Summary and per-entity narrative sections — "Enel scores B overall, strongest on topics X/Y, with CSRD-mandatory coverage gaps in Z" — in TCFD/ISSB S2/CSRD register, every figure lifted from the computed matrix.

**How.** Tier 1 against page state plus this Atlas record: the corpus includes §7.2's formula definitions (so the copilot explains that `overall` is an unweighted L1-topic mean and what the A–E bands are) and the accurate per-jurisdiction framework/effective-date reference content §7.5 credits. Narrative templates map to the report tabs (Executive Summary, Entity Reports, Comparative Analysis), and the roadmap's tier-3 vision explicitly names report-studio modules as the render layer for LLM-drafted, engine-sourced memos — this module is that pattern's pilot. Guardrail: until Evolution A lands, every draft must carry the synthetic-data disclaimer, since narrating `sr()`-seeded scores for named companies (Shell rated C, say) is a reputational hazard if exported.

**Prerequisites.** Evolution A's real assessment feed for any externally-shared output; internal demo drafting can ship now with the disclaimer enforced in the system prompt. **Acceptance:** every number and rating in a draft matches the matrix; jurisdiction claims cite `REGULATORY_REQUIREMENTS` rows; drafts on synthetic data are watermarked as illustrative.