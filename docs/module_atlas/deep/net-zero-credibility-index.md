## 7 · Methodology Deep Dive

This module matches its MODULE_GUIDES entry exactly: a **15-KPI net-zero credibility index** scoring 15
companies 0–150 with an A–E rating. Uniquely among the net-zero family, it is **entirely hand-authored
expert scoring** — no PRNG at all. Each company's 15 KPI scores (0–10) are analyst judgements; the
composite and rating are honest arithmetic over them.

### 7.1 What the module computes

```js
total  = Σ_{i=1}^{15} scores_i          // 0–150
nzRating(total) = total≥120 A / ≥100 B / ≥70 C / ≥40 D / else E
```

The 15 KPIs are the exact set the guide lists: SBTi Validation, CapEx Green Ratio, R&D Clean Tech %,
Lobbying Alignment, Exec Comp Climate, Board Climate Expertise, Scope 3 Coverage, Offset Dependency, Just
Transition, TCFD Quality, CDP Score, RE Procurement %, Methane Management, Supply Chain Engagement,
Physical Risk Disclosure. Per-KPI drill-downs (CapEx `scores[1]`, Lobbying `scores[3]`, Exec/Board
`scores[4]`/`scores[5]`) power the thematic tabs.

### 7.2 Parameterisation / scoring rubric

| Company | Sector | Total (0–150) | Rating | Provenance |
|---|---|---|---|---|
| Orsted | Utilities | 135 | A | Hand-authored expert scores |
| Iberdrola | Utilities | 126 | A | Hand-authored |
| Microsoft | Tech | 128 | A | Hand-authored |
| Schneider | Industrial | 123 | A | Hand-authored |
| Unilever | Consumer | 115 | B | Hand-authored |
| BNP Paribas | Finance | 101 | B | Hand-authored |
| HSBC | Finance | 88 | C | Hand-authored |
| Shell | Energy | ~71 | C | Hand-authored |
| BP / TotalEnergies | Energy | ~64 / ~54 | D | Hand-authored |
| ExxonMobil | Energy | ~32 | E | Hand-authored |
| Glencore | Mining | ~40 | E/D | Hand-authored |

*(Totals shown are the sum of each company's 15 stored scores.)* The scoring ordering is defensible expert
judgement — renewables-pivot leaders (Orsted, Iberdrola) top the index; fossil majors (Exxon, BP, Total)
and Glencore sit at the bottom, consistent with **InfluenceMap** and **NewClimate CCRM** findings.

| Rating band | Threshold | Basis |
|---|---|---|
| A | ≥120 | Author (guide: A≥120) |
| B | ≥100 | matches guide |
| C | ≥70 | matches guide |
| D | ≥40 | matches guide |
| E | <40 | matches guide |

### 7.3 Calculation walkthrough

`COMPANIES` (15 records × 15 scores) → `total` per company via `.reduce` → `nzRating` bands → dashboard
KPIs (A-rated count, index average, E-rated count). Selecting a company builds a 15-axis radar of its KPI
scores. Thematic tabs slice individual KPIs (CapEx alignment, lobbying consistency, exec-comp linkage) and
rank companies on them. `ratingDist` counts companies per rating band.

### 7.4 Worked example (Orsted vs ExxonMobil)

Orsted `scores = [10,9,9,9,10,8,10,9,8,9,9,10,8,8,9]`:

```
total = 10+9+9+9+10+8+10+9+8+9+9+10+8+8+9 = 135  → nzRating(135) = 'A'
```

ExxonMobil `scores = [2,2,2,1,1,2,3,3,2,3,2,1,3,2,2]`:

```
total = 2+2+2+1+1+2+3+3+2+3+2+1+3+2+2 = 31  → nzRating(31) = 'E'
```

The 104-point spread cleanly separates a transition leader (A) from a laggard (E) — the index's core
purpose.

### 7.5 Data provenance & limitations

- **All scores are hand-authored expert judgements** — no PRNG, but also not traceable to a specific
  disclosure-parsing pipeline. Each of the 15 KPIs is assigned a single 0–10 integer per company.
- **Static and small** (15 companies): no automated ingestion from SBTi/CDP/InfluenceMap, so scores do not
  update with new disclosures and are not reproducible from primary evidence.
- Equal weighting (each KPI 0–10, no KPI weights) implies, e.g., that "Methane Management" and "SBTi
  Validation" carry identical index weight — a simplification vs a materiality-weighted composite.

**Framework alignment:** The 15 KPIs map to real credibility signals: **SBTi** (target validation, offset
cap), **CDP** (disclosure score), **InfluenceMap** (lobbying alignment), **RE100** (RE procurement),
**TCFD** (disclosure quality), and **NewClimate CCRM** (CapEx/R&D, just transition, Scope 3). The scoring
approach mirrors the **NewClimate Corporate Climate Responsibility Monitor** and **InfluenceMap** integrity
assessments. Because the scores are hand-set rather than computed from primary data, §8 specifies the
production scoring model.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The 15×15 scores are hand-authored. Below is the
production net-zero credibility scoring model.

### 8.1 Purpose & scope
Compute a reproducible 15-KPI net-zero credibility score per company from primary disclosures, with
materiality weighting and evidence traceability, for ESG rating, stewardship, and portfolio screening.

### 8.2 Conceptual approach
A weighted multi-KPI composite scored from primary sources, benchmarked against **NewClimate CCRM**
(dimension design), **InfluenceMap** (lobbying), and **SBTi/CDP** (validated targets, disclosure). Each KPI
scored by an explicit rubric with cited evidence.

### 8.3 Mathematical specification
`Credibility = Σ_{i=1}^{15} w_i·s_i / Σ w_i · scale`, `s_i ∈ [0,10]` from a per-KPI rubric (e.g. SBTi:
0 none → 10 validated 1.5 °C near+long term; Offset Dependency: 10 = ≤10 % residual, 0 = offset-heavy).
Materiality weights `w_i` sector-specific (methane weighted higher for energy). Rating bands as coded
(A≥120…E<40 on a 0–150 scale, or the weighted equivalent). Confidence `= f(evidence completeness)`; scores
abstain below a threshold.

| Parameter | Source |
|---|---|
| KPI rubrics s_i | SBTi, CDP, InfluenceMap, RE100, TCFD |
| Weights w_i | NewClimate CCRM + sector materiality (SASB) |
| Lobbying data | InfluenceMap scores |
| CapEx/R&D green ratio | Company reports / EU Taxonomy alignment |

### 8.4 Data requirements
SBTi registry, CDP responses, InfluenceMap, TCFD/CSRD reports, capex breakdowns, RE100 data. Platform has
adjacent modules (`net-zero-commitment-tracker`, `narrative-intelligence`) but no primary-data ingestion.

### 8.5 Validation & benchmarking plan
Correlate composite against NewClimate CCRM integrity ratings and InfluenceMap organisation scores (target
rank correlation >0.7); inter-rater reliability on KPI rubrics (κ); backtest against subsequent SBTi
validations/withdrawals.

### 8.6 Limitations & model risk
Self-reported data is gameable; rubric subjectivity persists; equal vs materiality weighting changes
rankings. Conservative fallback: require evidence citations per KPI, weight by sector materiality, and
abstain when disclosure is incomplete.
