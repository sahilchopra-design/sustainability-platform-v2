## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** MODULE_GUIDES describes an **ESG Materiality Score** —
> `EMS = Σ wᵢ × TopicScoreᵢ × SeverityMultiplierᵢ`, using SASB sector-material topic weighting.
> **The code does not compute this.** `score`, `envScore`, `socScore`, and `govScore` are drawn as
> **four statistically independent random values** from the seeded PRNG (`s(31)`, `s(37)`, `s(41)`,
> `s(43)` respectively) — `score` is not a weighted function of the E/S/G sub-scores, and no SASB
> topic list, weight, or severity multiplier appears anywhere in the extracted formulas. Sections
> below document the code as it behaves; §8 specifies the EMS model the guide describes.

### 7.1 What the module computes

```
score      = 20 + s(31)×75      // overall diligence score, independent of E/S/G below
envScore   = 15 + s(37)×80
socScore   = 15 + s(41)×80
govScore   = 20 + s(43)×75
completion = 20 + s(73)×78      // % of diligence checklist complete
compliance = 30 + s(79)×68      // % regulatory compliance
```

50 synthetic diligence records are generated across 6 categories (Pre-Acquisition, 100-Day Plan,
Value Creation, Exit Readiness, Portfolio Review, Annual Assessment) and 8 PE-sector verticals.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `score` | 20–95 | Synthetic demo value, **independent of** `envScore`/`socScore`/`govScore` |
| `envScore`/`socScore`/`govScore` | 15–95 / 15–95 / 20–95 | Synthetic demo value, each independently seeded |
| `risk` | Low/Medium/High/Critical, `s(29)`-indexed | Synthetic demo value, uncorrelated with `score` |
| `m1`–`m6` | assorted 0–100/0–50/0–25 ranges | Synthetic demo value, unlabelled generic metric placeholders |
| `q1`–`q4` (quarterly score) | 20–95 each | Synthetic demo value, independent per quarter — no autocorrelation modelling a real company's ESG improvement trajectory would show |

### 7.3 Calculation walkthrough

1. **Record generation** (`genData(50)`): each field uses a distinct multiplier `idx` fed into
   `s(idx) = sr(i*idx+idx)` — this decorrelates every field from every other by construction (E, S,
   G, overall score, completion, compliance are all separately drawn), which is the direct cause of
   the guide-vs-code gap: there is no `score = f(envScore, socScore, govScore)` relationship to
   invert or verify.
2. **Radar chart** (`radarData`): averages `envScore`/`socScore`/`govScore`/`completion`/
   `compliance`/`score` across the filtered set — a legitimate aggregation *mechanic*, just applied
   to uncorrelated underlying data.
3. **Trend** (`trendData`): averages `q1..q4` per quarter across filtered records — again a correct
   aggregation, but the underlying quarterly scores carry no real trajectory signal.
4. **Sector scoring** (`sectorScore`): mean `score` grouped by sector — susceptible to being
   dominated by whichever sector has the most records in a filtered slice, with no materiality
   weighting by sector (SASB's core premise is that *different* topics matter for *different*
   sectors — this module treats all sectors identically).

### 7.4 Worked example

For record `i=12`: `envScore = 15+s(37×13+37)×80`, `socScore = 15+s(41×13+41)×80`,
`govScore = 20+s(43×13+43)×75`, `score = 20+s(31×13+31)×75` — each computed from a distinct seed
offset, so knowing any three of the four values gives no information about the fourth. There is no
worked-example arithmetic path from E/S/G sub-scores to the headline `score` because none exists in
the code.

### 7.5 Data provenance & limitations

- **All 50 diligence records are synthetic demo data**, decorrelated by construction across every
  scored dimension.
- **SASB material-topic mapping is entirely absent** — no per-sector topic list, no topic weight,
  no severity multiplier despite being the guide's headline methodology.
- Value-creation-plan tab (100-day plan, KPI targets) exists per the guide's `userInteraction` list
  but its formulas were not captured in the extracted `computed` set; based on the pattern elsewhere
  in the file it is likely also independently-seeded display data rather than derived from the
  diligence scores.

**Framework alignment:** PRI Due Diligence Questionnaire for PE (2023) and SASB Materiality Map are
cited as the methodology basis but neither the SASB topic taxonomy nor a materiality-weighted
scoring formula is implemented; the module functions as a generic diligence-tracker dashboard rather
than a SASB-calibrated ESG diligence tool.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Score a PE target's ESG performance against sector-specific material topics to (a) surface
diligence red flags pre-close and (b) seed a 100-day value-creation plan — the decision context the
guide's `userInteraction` list describes.

### 8.2 Conceptual approach
**SASB Materiality Map**-driven topic scoring: each GICS/SASB sector has a published list of
financially-material sustainability topics (5–10 typically); score management performance on each,
weight by the topic's financial-impact potential for that sector, and apply a severity multiplier
for topics with an active controversy — this mirrors how **Moody's ESG Solutions** and **ISS ESG**
structure sector-materiality-weighted corporate ratings, and how **PRI's PE DDQ** structures its
sector-tailored due-diligence question sets.

### 8.3 Mathematical specification

```
EMS = Σ_topic w_topic × TopicScore_topic × SeverityMultiplier_topic
w_topic:  from SASB Materiality Map sector matrix, normalised to Σw=1 per sector
TopicScore: 0-100, management-quality rating on each material topic (interview + document review)
SeverityMultiplier: 1.0 baseline; 0.5x if active/unresolved controversy on that topic; 1.0 otherwise
```

| Parameter | Calibration source |
|---|---|
| SASB material topic list + weights | SASB Materiality Map (sector-specific, published, free) |
| Severity multiplier | Internal DD policy calibrated to controversy severity taxonomy (RepRisk severity scale: low/medium/high/severe) |
| Topic scores | Structured interview + document review, scored 0–100 by DD team |

### 8.4 Data requirements
Target sector (GICS→SASB mapping), management interview scorecards per material topic, controversy
screen (RepRisk/Sustainalytics) for severity multiplier inputs. None currently ingested; sector
mapping could reuse the platform's existing GICS taxonomy used elsewhere.

### 8.5 Validation & benchmarking plan
Compare EMS distribution against realised value-creation outcomes (MOIC uplift) for closed deals to
validate the model has predictive signal, per the guide's cited McKinsey PE ESG value-creation
research; sanity-check topic weights against SASB's published financial-materiality rationale.

### 8.6 Limitations & model risk
SASB topic scores from a single DD interview cycle carry rater-subjectivity risk — recommend
multi-rater scoring with documented rationale per topic, and periodic (annual) re-scoring for
portfolio-company monitoring rather than a one-time pre-acquisition snapshot.
