## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code note (no NLP/ML).** The guide advertises an NLP+ML greenwashing model with weighted
> composite `GWS = w₁·ClaimEvidenceGap + w₂·SelectivityIndex + w₃·VaguenessScore + w₄·RegulatoryGapScore`.
> The page implements **none** of that. It generates 30 synthetic companies via the `sr()` PRNG and
> derives an **Integrity** score (not the guide's GWS) from three seeded inputs: self-reported score,
> third-party score and disclosure quality. The backend `greenwashing_engine.py` (shared with the
> `greenwashing-detection` route) does real term-screening, but this page does not call it.

### 7.1 What the page computes

Company generation (`genCompanies`, 30 companies) seeds every field:

```js
selfScore  = 45 + floor(sr(s×3)×50)                      // 45–95 (self-reported)
thirdParty = max(15, selfScore − floor(sr(s×11)×35) + 5) // independent rating, usually ≤ self
gap        = selfScore − thirdParty                       // overstatement gap
discQuality= 30 + floor(sr(s×17)×65)                      // 30–95 disclosure quality
integrity  = clamp(10, 99, floor(
               thirdParty×0.4 + discQuality×0.3 + (100−|gap|)×0.3 ))
tier = integrity≥85 Platinum | ≥70 Gold | ≥55 Silver | ≥40 Bronze | else Flagged
```

The **integrity** score is the headline: it *rewards* a high independent rating and disclosure quality,
and *penalises* a large self-vs-third-party gap (via `100−|gap|`).

### 7.2 Parameterisation / rubric

| Component | Weight in integrity | Meaning |
|---|---|---|
| thirdParty | 0.40 | Independent ESG rating (anchor of credibility) |
| discQuality | 0.30 | Completeness of disclosure across 15 dimensions |
| 100 − \|gap\| | 0.30 | Penalty for self-reporting inflation |

12 `FLAG_TYPES` each carry a severity (`FLAG_SEVERITY = [9,7,6,8,7,8,6,5,6,7,9,8]`, 1–9) — highest for
"Score Gap >15pts" and "Transition Plan Absent" (9). 15 `DISC_DIMS` (GHG, Water, Biodiversity, Human
Rights, Transition Plan, Taxonomy Alignment…) each get a seeded 20–95 score with a real
`DISC_DIM_SOURCES` citation (CDP, TNFD LEAP, GHG Protocol, GRESB). `REG_REQS` (19 rows) get a seeded
Compliant / Partial / Non-Compliant status (`sr>0.6 / >0.3 / else`).

### 7.3 Calculation walkthrough

Each company also gets: green revenue % (`sr(s×19)×80`), carbon intensity (`50 + sr(s×23)×450`),
SBTi status, assurance level, E/S/G pillar scores (20–95), a flag set (0–5 unique flags drawn from
the 12 types), 15 disclosure-dimension scores and 19 regulatory statuses. Portfolio KPIs aggregate:
`avgInt`, `avgGap`, `totalFlags`, count below the 40 integrity threshold ("Flagged"). Sector box-plots
and the integrity-vs-disclosure scatter drive the visual analytics.

### 7.4 Worked example (one company)

Suppose `selfScore = 80`, `thirdParty = 62`, `discQuality = 70`:

| Step | Computation | Result |
|---|---|---|
| gap | 80 − 62 | 18 |
| integrity | 62×0.4 + 70×0.3 + (100−18)×0.3 | 24.8 + 21.0 + 24.6 = **70** |
| tier | 70 ≥ 70 | **Gold** |

A large 18-point self-vs-third-party gap costs `18×0.3 = 5.4` integrity points; had self and third
matched (gap 0) the score would be 70 + 5.4 ≈ 75. The gap penalty is the core greenwashing signal.

### 7.5 Data provenance & limitations

- **All 30 companies are synthetic** — names, ratings, disclosure scores, flags and regulatory statuses
  all come from `sr(seed)=frac(sin(seed+1)×10⁴)`. No document, rating feed or filing is used.
- The page computes **Integrity**, not the guide's four-component GWS; vagueness, selectivity and
  regulatory-gap indices named in the guide are not calculated (they survive only as flag labels).
- The real term-screening engine (`greenwashing_engine.py`, 40 misleading terms, substantiation
  scoring) is present in the backend but unused here.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Score issuer greenwashing risk by combining claim-evidence gap, selectivity,
vagueness and regulatory-gap components into the guide's GWS (0–100), for pre-DD screening.

**8.2 Conceptual approach.** NLP claim extraction + evidence matching (per ESMA greenwashing taxonomy)
combined with a self-vs-independent rating divergence signal, mirroring RepRisk controversy analytics
and MSCI ESG rating-gap methods. The divergence term the page already computes (`gap`) becomes one of
four weighted inputs.

**8.3 Mathematical specification.**
```
ClaimEvidenceGap = share of quantitative claims lacking matching reported data
SelectivityIndex = 1 − (negative_metrics_disclosed / expected_negative_metrics)
VaguenessScore   = share of sustainability sentences without a measurable target
RegulatoryGapScore = deviation from FCA SDR / ESMA minimum specificity
RatingDivergence = normalise(selfScore − thirdParty)              // the page's gap
GWS = 100 × (w₁·ClaimEvidenceGap + w₂·SelectivityIndex + w₃·VaguenessScore
              + w₄·RegulatoryGapScore + w₅·RatingDivergence),  Σwᵢ = 1
Flag if GWS > 65; referral risk if > 80
```

| Parameter | Value / source |
|---|---|
| Component weights w₁…₅ | calibrate to enforcement outcomes; start 0.3/0.2/0.2/0.15/0.15 |
| Misleading terms | engine `MISLEADING_TERMS` (40, EU GCD/ESMA/FCA) |
| Disclosure-dimension sources | CDP, TNFD LEAP, GHG Protocol (page `DISC_DIM_SOURCES`) |
| Referral thresholds | FCA/ESMA/SEC precedent |

**8.4 Data requirements.** Issuer disclosure text, reported ESG metrics, self-reported vs independent
ratings (MSCI/Sustainalytics), SFDR class, product labels. The page already holds the disclosure-
dimension taxonomy and flag/remediation library.

**8.5 Validation.** Precision/recall of GWS>65 flags vs realised enforcement; stability of component
weights across sectors; reconcile RatingDivergence against actual MSCI rating-gap data.

**8.6 Limitations & model risk.** NLP false positives; selectivity requires a defined "expected
negative metrics" set (sector-dependent); rating divergence conflates methodology differences with
greenwashing. Conservative fallback: surface component scores and matched terms, not a single number.

**Framework alignment:** EU Green Claims Directive (2024) — substantiation; FCA Greenwashing Rule
(2024) / SDR — clarity and labelling; ESMA Greenwashing Progress Report (2023) — the four-component
taxonomy; SBTi / EU Taxonomy — the verification anchors behind the flag-remediation guidance.
