## 7 · Methodology Deep Dive

> ✅ **Guide↔code: broadly faithful.** Unlike its sibling `gresb-real-assets-esg`, this module actually
> *computes* GRESB scores from aspect-level inputs against **real peer benchmark tables**, derives star
> ratings by peer quintile, and supports user overrides (persisted to localStorage). The one caveat:
> the guide's headline `0.30×Management + 0.70×Performance` split is not the scoring path used here —
> the page averages 7 equally-weighted aspects (each scored /20) into a 0–100 total, then maps to stars
> via peer percentiles. So the aspect model is real; the 30/70 Management/Performance weighting is
> descriptive, not the computation.

### 7.1 What the module computes

**Total score** — mean of 7 aspect scores (each 0–20), rescaled to 0–100:

```js
score_aspect = override ?? seeded(round(8 + sr(idx×70 + aspectIdx×30)×12))   // 8–20 default
totalScore   = round( Σ aspect / GRESB_ASPECTS.length / 20 × 100 )           // 7 aspects, /20, ×100
```

**Star rating** — peer-quintile placement against `PEER_BENCHMARKS[peerGroup]`:

```js
star = score ≥ p90 ? 5 : score ≥ p75 ? 4 : score ≥ median ? 3 : score ≥ p25 ? 2 : 1
```

**Peer percentile** — piecewise-linear interpolation *within* the benchmark bands:

```js
if score ≥ p90:   90 + (score−p90)/(100−p90)×10
elif score ≥ p75: 75 + (score−p75)/(p90−p75)×15
elif score ≥ med: 50 + (score−median)/(p75−median)×25
elif score ≥ p25: 25 + (score−p25)/(median−p25)×25
else:             max(1, score/p25 × 25)
```

### 7.2 Parameterisation — aspects & peer benchmarks

**7 GRESB aspects** (each maxScore 20), mapped to TCFD pillars:

| Aspect | TCFD pillar |
|---|---|
| Leadership | Governance |
| Policies | Strategy |
| Risk Management | Risk Management |
| Monitoring & EMS | Metrics & Targets |
| Stakeholder Engagement | Strategy |
| Performance Indicators | Metrics & Targets |
| Building Certifications | Metrics & Targets |

**`PEER_BENCHMARKS`** — 19 real GRESB peer groups with median/p25/p75/p90/avgStars (GRESB 2024
distribution). Examples: Residential Europe median 78 / p90 94; Retail LATAM median 52 / p90 72;
Office Europe median 76 / p90 92. These percentiles are the externally-anchored core of the scorer —
they place a fund in its correct sector-region cohort, exactly as GRESB does.

### 7.3 Calculation walkthrough

Each property's 7 aspect scores (seeded default, or user override 0–20) → `totalScore` (0–100) →
`getStarRating(score, peerGroup)` → `getPeerPercentile`. Users can edit aspect scores, historical
scores, and peer group (all persisted). The submission checklist (10 items) and aspect-level
improvement recommendations drive the roadmap; a what-if raises `integrity`/score by improving chosen
aspects. Distribution charts bin totals into 40–100 bands.

### 7.4 Worked example (an Office Europe fund)

Aspect scores {Leadership 16, Policies 14, Risk 12, Monitoring 15, Stakeholder 13, Performance 17,
Certifications 15}, peer group Office Europe (median 76, p25 66, p75 85, p90 92):

| Step | Computation | Result |
|---|---|---|
| Σ aspects | 16+14+12+15+13+17+15 | 102 |
| totalScore | 102 / 7 / 20 × 100 | round(72.86) = **73** |
| star rating | 73 in [p25 66, median 76) | **2 stars** |
| percentile | 25 + (73−66)/(76−66)×25 | 25 + 17.5 = **42.5th pct** |

A raw 73 looks decent, but against the strong Office Europe cohort (median 76) it lands at 2 stars /
43rd percentile — the peer-relative logic correctly penalises a fund below its demanding benchmark.

### 7.5 Data provenance & limitations

- **Default aspect scores are seeded** (`sr()` PRNG, 8–20 range) but are **user-overridable** — real
  data can replace the demo scores, and overrides persist to localStorage.
- The 19 peer-benchmark distributions are realistic GRESB 2024 figures and drive genuine peer-relative
  star ratings — the substantive methodology here is sound.
- Scoring uses a 7-aspect equal-weight average, not the official 30/70 Management/Performance
  aggregation; official GRESB also applies question-level weights within each component that this
  simplification omits.

### 7.6 Framework alignment

**GRESB Real Estate Assessment (2024)** — the module reproduces GRESB's core mechanics: aspect scoring,
peer-benchmark placement, and 5-star quintile rating (5-star = top 20% of peer group). **TCFD** — each
aspect is tagged to a TCFD pillar (Governance/Strategy/Risk/Metrics), supporting dual GRESB-TCFD
reporting. **CRREM** — the Performance/Certification aspects underpin building decarbonisation
pathways. GRESB itself derives the star rating by ranking an entity's total score within its GRESB
peer group and assigning quintiles — precisely the `p25/median/p75/p90` cutoffs this page uses.

*(No §8 model spec: GRESB is a defined third-party assessment methodology and this module implements it
faithfully — aspect scoring against real peer-benchmark quintiles — rather than inventing a proprietary
risk model. The only simplification (equal-weight aspects vs 30/70) is documented in §7.5.)*
